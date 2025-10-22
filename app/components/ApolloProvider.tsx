"use client";

import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { ApolloProvider as Provider } from "@apollo/client/react";
import { ReactNode } from "react";

const httpLink = new HttpLink({
  uri: "/api/graphql",
  credentials: "same-origin",
});

const authLink = setContext((_, { headers }) => {
  // Get the token from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("workoutToken") : null;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          workouts: {
            keyArgs: ["categoryId"], // Cache separately for each categoryId
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Workout: {
        keyFields: ["id"], // Ensure workouts are cached by their unique ID
      },
      WorkoutSet: {
        keyFields: ["id"], // Ensure workout sets are cached by their unique ID
      },
    },
  }),
});

export default function ApolloProvider({ children }: { children: ReactNode }) {
  return <Provider client={client}>{children}</Provider>;
}
