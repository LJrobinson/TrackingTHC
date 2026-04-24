import "server-only";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "BUDTENDER" | "AUDITOR";
};

export async function getCurrentUser(): Promise<CurrentUser> {
  return {
    id: "dev-user",
    name: "Demo Operator",
    email: "operator@trackingthc.local",
    role: "OWNER"
  };
}
