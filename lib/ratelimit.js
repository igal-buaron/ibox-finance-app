import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// עד 5 ניסיונות התחברות כושלים לכל IP בכל 60 שניות
export const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ibox:ratelimit:login",
});
