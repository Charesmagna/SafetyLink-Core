const { createClient } = require("@libsql/client");
try {
  const db = createClient({ url: "file:/root/safetylink.db" });
  console.log("Client created successfully");
} catch (e) {
  console.error("Client creation failed:", e.message);
}
