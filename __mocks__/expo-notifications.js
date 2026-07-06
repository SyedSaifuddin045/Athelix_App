const AndroidImportance = { MAX: 5 };

const notificationHandler = {
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: "undetermined" })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: "mock-push-token" })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance,
  NotificationBehavior: {},
};

module.exports = notificationHandler;
module.exports.default = notificationHandler;
