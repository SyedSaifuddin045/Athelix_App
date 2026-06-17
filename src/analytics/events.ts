export const Events = {
  // Auth
  USER_SIGNED_UP: "user signed up",
  USER_LOGGED_IN: "user logged in",
  USER_LOGGED_OUT: "user logged out",
  PROFILE_SETUP_COMPLETED: "profile setup completed",

  // Workout lifecycle
  WORKOUT_STARTED: "workout started",
  WORKOUT_COMPLETED: "workout completed",
  WORKOUT_DISCARDED: "workout discarded",
  EXERCISE_ADDED: "exercise added during workout",
  SET_COMPLETED: "workout set completed",
  WORKOUT_MOOD_RECORDED: "workout mood recorded",

  // Templates
  TEMPLATE_CREATED: "template created",
  TEMPLATE_EDITED: "template edited",
  TEMPLATE_USED: "template used",

  // Progress
  PERSONAL_RECORDS_VIEWED: "personal records viewed",
  EXERCISE_PROGRESS_VIEWED: "exercise progress viewed",
  MUSCLE_BALANCE_VIEWED: "muscle balance viewed",
  BODYWEIGHT_HISTORY_VIEWED: "bodyweight history viewed",
  BODYWEIGHT_LOGGED: "bodyweight logged",

  // Feature engagement
  MESOCYCLE_CREATED: "mesocycle created",
  EXERCISE_DETAIL_VIEWED: "exercise detail viewed",
  EXERCISE_SEARCHED: "exercise searched",
  EXERCISE_FILTERED: "exercise filtered",
  NOTIFICATION_SETTING_CHANGED: "notification setting changed",
  ACCOUNT_SETTINGS_UPDATED: "account settings updated",
  FEEDBACK_PORTAL_OPENED: "feedback portal opened",
} as const;
