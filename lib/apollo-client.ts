import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { syncManager } from "./sync-manager";

const createApolloClient = () => {
  const httpLink = new HttpLink({
    uri: "/api/graphql",
    credentials: "same-origin",
  });

  const authLink = setContext((_, { headers }) => {
    // Get the token from localStorage
    const token = localStorage.getItem("workoutToken");
    console.log(
      "Apollo Client: token from localStorage:",
      token ? token.substring(0, 20) + "..." : "null"
    );
    console.log("Apollo Client: Full token:", token);
    console.log("Apollo Client: Headers being sent:", {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    });

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  });

  return new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache({
      // Optimize cache performance
      typePolicies: {
        WorkoutSession: {
          keyFields: ["id"],
          fields: {
            exercises: {
              merge: false, // Don't merge arrays, replace them
            },
            categories: {
              merge: false, // Don't merge arrays, replace them
            },
          },
        },
        WorkoutExercise: {
          keyFields: ["id"],
          fields: {
            workoutSets: {
              merge: false, // Don't merge arrays, replace them
            },
          },
        },
        Category: {
          keyFields: ["id"],
        },
        Query: {
          fields: {
            workoutSessions: {
              merge: false, // Disable merging completely
            },
            searchExercises: {
              merge: false, // Don't merge search results
            },
            categories: {
              merge: false, // Don't merge categories
            },
          },
        },
      },
      // Enhanced cache configuration
      resultCaching: true,
      // Add cache size limits
      possibleTypes: {},
    }),
    // Performance optimizations
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
      },
      query: {
        fetchPolicy: "cache-first",
        errorPolicy: "all",
      },
    },
  });
};

export default createApolloClient;
