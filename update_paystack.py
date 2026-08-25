import sys

file_path = "src/components/PricingModal.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace(
    "key: 'pk_test_your_paystack_public_key', // Replace with real key in production",
    "key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_paystack_public_key', // Uses env in production"
)

with open(file_path, "w") as f:
    f.write(content)
