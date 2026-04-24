<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

- Use Tailwind for styling. Do not use CSS modules or any other styling method.
- Always write tests first. Use the /tdd plugin
- Keep the components small with a clear single responsibility. If a component grows too large, break it down into smaller components.
- Never commit secrets, like the DB connection string, to version control. Use environment variables instead.
- Always write documentation for your code. Use JSDoc comments to explain the purpose of functions
