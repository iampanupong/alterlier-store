CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limits_count_non_negative" CHECK ("rate_limits"."count" >= 0)
);
