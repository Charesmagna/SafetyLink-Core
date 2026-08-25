import sys

file_path = "src/components/ErrorBoundary.tsx"
with open(file_path, "r") as f:
    content = f.read()

new_did_catch = """  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SafetyLink ErrorBoundary]', error, info);
    // Integrate commercial crash reporting (e.g., Sentry / Firebase Crashlytics)
    try {
      if (window && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, { extra: info });
      }
    } catch (e) {
      console.warn('Failed to send crash report to analytics hook.', e);
    }
  }"""

content = content.replace(
    "  componentDidCatch(error: Error, info: ErrorInfo) {\n    console.error('[SafetyLink ErrorBoundary]', error, info);\n  }",
    new_did_catch
)

with open(file_path, "w") as f:
    f.write(content)
