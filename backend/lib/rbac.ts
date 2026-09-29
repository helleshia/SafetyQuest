/* Role-based access control.

   One table, read by the server on every protected request. A console can hide a
   menu item, but only this decides what an account may actually reach. */

export type Role = "Super Admin" | "Teacher" | "Parent" | "Student";
export const ROLES: Role[] = ["Super Admin", "Teacher", "Parent", "Student"];

export type RoleRules = {
  /** Can this role sign in to the web consoles at all? */
  webSignIn: boolean;
  /** The console it lands on after signing in. */
  console: "admin" | "teacher" | "parent" | null;
  /** API path prefixes this role may reach. */
  allows: string[];
  /** Shown when the role is refused, so the person knows where to go instead. */
  refusal?: string;
  summary: string;
};

export const RBAC: Record<Role, RoleRules> = {
  "Super Admin": {
    webSignIn: true,
    console: "admin",
    allows: ["/api/admin", "/api/auth"],
    summary: "The whole deployment: accounts, academic year, curriculum, consent, reports, and audit.",
  },
  Teacher: {
    webSignIn: true,
    console: "teacher",
    allows: ["/api/teacher", "/api/auth"],
    summary: "Only the classes assigned to them, and the learners in those classes.",
  },
  Parent: {
    webSignIn: true,
    console: "parent",
    allows: ["/api/parent", "/api/auth"],
    summary: "Only children whose guardian link a teacher verified, and only published results.",
  },
  Student: {
    webSignIn: false,
    console: null,
    allows: [],
    refusal: "Students learn in the SafetyQuest mobile app. There is no student sign-in on the website.",
    summary: "Lessons and practicals in the mobile app. No web console, by design.",
  },
};

export const canSignIn = (role: string): role is Role => ROLES.includes(role as Role) && RBAC[role as Role].webSignIn;

/** The message a refused role should see. Never says whether the account exists. */
export const refusalFor = (role: string) =>
  (ROLES.includes(role as Role) && RBAC[role as Role].refusal) || "This account cannot sign in here.";

/** Whether a role may reach an API path. Routes still call `requireUser` with the
    roles they accept; this is the table that says why, in one readable place. */
export function mayReach(role: string, path: string) {
  if (!ROLES.includes(role as Role)) return false;
  return RBAC[role as Role].allows.some(prefix => path.startsWith(prefix));
}
