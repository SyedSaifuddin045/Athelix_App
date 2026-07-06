import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient } from "@tanstack/react-query";
import { createWrapper, createMockNavigation } from "../../test/test-utils";
import { queryKeys } from "../../api/queryKeys";
import { SettingsScreen } from "../../screens/SettingsScreen";

const mockUseAuth = jest.fn();
const mockUsePostHog = jest.fn();

jest.mock("@clerk/expo", () => ({
  useAuth: () => mockUseAuth(),
  ClerkProvider: "ClerkProvider",
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock("posthog-react-native", () => ({
  usePostHog: () => mockUsePostHog(),
}));

const mockApiFetch = jest.fn();
jest.mock("../../api/client", () => ({
  apiFetch: (...args: any[]) => mockApiFetch(...args),
  getApiErrorMessage: (err: any) => err?.message || "Something went wrong.",
}));

let mockNavigation: any;
let mockCapture: jest.Mock;

const mockUserData = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function setupQC(userData?: typeof mockUserData) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  if (userData) {
    qc.setQueryData(queryKeys.currentUser, userData);
  }
  return qc;
}

function renderScreen(qc: QueryClient) {
  return render(
    <SettingsScreen navigation={mockNavigation} />,
    { wrapper: createWrapper({ queryClient: qc }) },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigation = createMockNavigation();
  mockCapture = jest.fn();
  mockUsePostHog.mockReturnValue({ capture: mockCapture });
  mockUseAuth.mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    userId: "user_1",
    getToken: jest.fn().mockResolvedValue("test-token"),
    signOut: jest.fn(),
  });
});

const PORTAL_URL = "https://feedback.athelix.fit?__clerk_ticket=sint_test123";

function mockPortalSuccess() {
  mockApiFetch.mockResolvedValue({
    json: () => Promise.resolve({ url: PORTAL_URL }),
  } as Response);
}

function mockPortalFailure() {
  mockApiFetch.mockRejectedValue(new Error("API error"));
}

describe("SettingsScreen feedback link", () => {
  it("renders the feedback section with correct text", () => {
    const qc = setupQC(mockUserData);
    const { getByText } = renderScreen(qc);
    expect(getByText("Feedback & Feature Requests")).toBeTruthy();
    expect(getByText("Suggest features, report bugs, or write a review")).toBeTruthy();
  });

  it("opens feedback portal ticket URL when pressed", async () => {
    mockPortalSuccess();
    const { Linking } = require("react-native");
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const qc = setupQC(mockUserData);
    const { getByText } = renderScreen(qc);
    fireEvent.press(getByText("Feedback & Feature Requests"));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith("/auth/generate-portal-token", { method: "POST" });
    });

    await waitFor(() => {
      expect(openURLSpy).toHaveBeenCalledWith(PORTAL_URL);
    });

    openURLSpy.mockRestore();
  });

  it("falls back to direct URL when API fails", async () => {
    mockPortalFailure();
    const { Linking } = require("react-native");
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const qc = setupQC(mockUserData);
    const { getByText } = renderScreen(qc);
    fireEvent.press(getByText("Feedback & Feature Requests"));

    await waitFor(() => {
      expect(openURLSpy).toHaveBeenCalledWith("https://feedback.athelix.fit");
    });

    openURLSpy.mockRestore();
  });

  it("captures analytics event when feedback link is pressed", async () => {
    mockPortalSuccess();
    jest.spyOn(require("react-native").Linking, "openURL").mockResolvedValue(undefined);

    const qc = setupQC(mockUserData);
    const { getByText } = renderScreen(qc);
    fireEvent.press(getByText("Feedback & Feature Requests"));

    await waitFor(() => {
      expect(mockCapture).toHaveBeenCalledWith("feedback portal opened");
    });
  });
});

describe("SettingsScreen general", () => {
  it("renders the screen title", () => {
    const qc = setupQC(mockUserData);
    const { getByText } = renderScreen(qc);
    expect(getByText("Account Settings")).toBeTruthy();
  });

  it("renders account detail fields when user data is available", async () => {
    const qc = setupQC(mockUserData);
    const { getByText, getByDisplayValue } = renderScreen(qc);
    await waitFor(() => {
      expect(getByText("Account Details")).toBeTruthy();
      expect(getByDisplayValue("testuser")).toBeTruthy();
      expect(getByDisplayValue("test@example.com")).toBeTruthy();
    });
  });

  it("does not render notification toggles (moved to NotificationSettings)", () => {
    const qc = setupQC(mockUserData);
    const { queryByText } = renderScreen(qc);
    expect(queryByText("Workout Reminders")).toBeNull();
    expect(queryByText("Push Notification Preferences")).toBeNull();
  });

  it("renders danger zone", () => {
    const qc = setupQC(mockUserData);
    const { getByText } = renderScreen(qc);
    expect(getByText("Delete Account")).toBeTruthy();
  });
});
