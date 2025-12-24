import { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT_ID } from "$env/static/public";
import { type RequestEvent } from "@sveltejs/kit";
import { Client, Account, Databases } from "appwrite";

const SESSION_COOKIE = "a_session";

// Client-side client
export const client = new Client()
  .setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
  .setProject(PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

// Server-side session client
export function createSessionClient(event: RequestEvent) {
  const client = new Client()
    .setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
    .setProject(PUBLIC_APPWRITE_PROJECT_ID);

  const session = event.cookies.get(SESSION_COOKIE);
  if (session) {
    client.setSession(session);
  }

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
}

export { SESSION_COOKIE };