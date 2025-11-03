"use client";

import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Create HTTP link
const httpLink = createHttpLink({
  uri: "/api/graphql",
});

// Create auth link (if needed for future authentication)
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token =
    typeof window !== "undefined" ? localStorage.getItem("workoutToken") : null;


  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          workoutSessions: {
            keyArgs: ["categoryId"], // Cache based on category filter
            merge(existing = [], incoming: any[], { args }) {
              // If no args (initial fetch or refetch without offset), replace
              if (args?.offset === 0 || !args?.offset) {
                return incoming;
              }
              // For pagination, deduplicate by ID to prevent duplicates
              const existingIds = new Set(existing.map((item: any) => item.id));
              const newItems = incoming.filter(
                (item: any) => !existingIds.has(item.id)
              );
              return [...existing, ...newItems];
            },
          },
          categories: {
            merge: false, // Replace categories array instead of merging
          },
        },
      },
      WorkoutSession: {
        keyFields: ["id"],
        fields: {
          exercises: {
            merge: false, // Replace exercises array instead of merging
          },
          categories: {
            merge: false, // Replace categories array instead of merging
          },
        },
      },
      WorkoutExercise: {
        keyFields: ["id"],
        fields: {
          workoutSets: {
            merge: false, // Replace workoutSets array instead of merging
          },
        },
      },
      Category: {
        keyFields: ["id"],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
    },
  },
});
