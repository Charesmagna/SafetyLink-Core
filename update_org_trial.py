import sys

file_path = "src/components/OrgDashboard.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Destructuring
content = content.replace(
    "generateReferralCode,\n  } = useAppStore();",
    "generateReferralCode,\n    isTrialEnabled,\n  } = useAppStore();"
)

# Banner
banner_code = """
      {/* Trial Banner */}
      {isTrialEnabled && (
        <div className="w-full bg-amber-600/90 text-white font-mono text-[10px] font-bold text-center py-1.5 px-4 tracking-wider uppercase flex items-center justify-center gap-2 relative z-50">
          <span>⚠️ 14-DAY ORGANIZATION TRIAL ACTIVE — YOU HAVE 14 DAYS LEFT ⚠️</span>
          <button className="bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded ml-2 transition-colors">UPGRADE TO PRO</button>
        </div>
      )}

      {/* Header Bar with custom theme colors if configured */}"""
content = content.replace("{/* Header Bar with custom theme colors if configured */}", banner_code)

with open(file_path, "w") as f:
    f.write(content)
