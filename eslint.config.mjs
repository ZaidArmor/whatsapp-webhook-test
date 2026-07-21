import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: ["legacy-whatsapp-webhook/**", ".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
