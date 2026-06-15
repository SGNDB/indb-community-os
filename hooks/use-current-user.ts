"use client";

import {useEffect, useState} from "react";

import {createClient} from "@/lib/supabase/client";

let cachedUserId: string | null | undefined = undefined;
let cachedUser: object | null | undefined = undefined;
let fetchPromise: Promise<{userId: string | null; user: object | null}> | null = null;

function getOrFetchUser() {
  if (cachedUserId !== undefined) {
    return Promise.resolve({userId: cachedUserId, user: cachedUser ?? null});
  }
  if (!fetchPromise) {
    fetchPromise = createClient()
      .auth.getUser()
      .then(({data}) => {
        cachedUserId = data.user?.id ?? null;
        cachedUser = data.user ?? null;
        return {userId: cachedUserId, user: cachedUser};
      })
      .catch(() => {
        cachedUserId = null;
        cachedUser = null;
        return {userId: null, user: null};
      });
  }
  return fetchPromise;
}

export function useCurrentUser() {
  const [state, setState] = useState<{
    userId: string | null | undefined;
    user: object | null | undefined;
    loading: boolean;
    error: Error | null;
  }>(() => {
    if (cachedUserId !== undefined) {
      return {
        userId: cachedUserId,
        user: cachedUser,
        loading: false,
        error: null,
      };
    }
    return {userId: undefined, user: undefined, loading: true, error: null};
  });

  useEffect(() => {
    let cancelled = false;
    getOrFetchUser()
      .then(({userId, user}) => {
        if (!cancelled) {
          setState({userId, user, loading: false, error: null});
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setState({userId: null, user: null, loading: false, error: err});
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
