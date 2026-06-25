-- SAFETY-LINK v5.0 — Migration 001: Initial Schema
-- Idempotent — safe to run multiple times.
-- Runs schema.sql then triggers.sql

\i database/schema.sql
\i database/triggers.sql
