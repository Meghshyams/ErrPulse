export interface ErrorPattern {
  pattern: RegExp;
  title: string;
  explanation: string;
  suggestion: string;
}

export const ERROR_PATTERNS: ErrorPattern[] = [
  // === Type Errors ===
  {
    pattern: /Cannot read propert(?:y|ies) of (undefined|null)/i,
    title: "Null Reference Access",
    explanation:
      "Your code tried to access a property on something that is undefined or null. This usually means a variable wasn't initialized, an API returned unexpected data, or an object was accessed before it was ready.",
    suggestion:
      "Add optional chaining (?.) or a null check before accessing the property. For example: obj?.property instead of obj.property.",
  },
  {
    pattern: /Cannot set propert(?:y|ies) of (undefined|null)/i,
    title: "Null Assignment",
    explanation: "Your code tried to set a property on something that is undefined or null.",
    suggestion:
      "Check that the object exists before assigning to it. Initialize the object first if needed.",
  },
  {
    pattern: /(\w+) is not a function/i,
    title: "Not a Function",
    explanation:
      "Your code tried to call something as a function, but it's not one. This often happens when a method name is misspelled, an import is wrong, or a callback wasn't passed correctly.",
    suggestion:
      "Check the spelling, verify the import, and make sure the value is actually a function before calling it.",
  },
  {
    pattern: /(\w+) is not defined/i,
    title: "Undefined Variable",
    explanation:
      "Your code references a variable that doesn't exist in the current scope. This could be a typo, a missing import, or a scoping issue.",
    suggestion:
      "Check for typos in the variable name and ensure it's imported or declared before use.",
  },
  {
    pattern: /Cannot access '(\w+)' before initialization/i,
    title: "Temporal Dead Zone",
    explanation:
      "A variable declared with let or const was used before its declaration was reached. JavaScript hoists the declaration but not the initialization.",
    suggestion:
      "Move the variable declaration before its first use, or restructure the code to avoid the circular dependency.",
  },
  {
    pattern: /Assignment to constant variable/i,
    title: "Constant Reassignment",
    explanation: "Your code tried to reassign a variable declared with const.",
    suggestion: "Use let instead of const if you need to reassign the variable.",
  },
  {
    pattern: /Maximum call stack size exceeded/i,
    title: "Stack Overflow",
    explanation:
      "A function called itself recursively without a proper exit condition, causing an infinite loop of calls until the stack ran out of space.",
    suggestion:
      "Add or fix the base case in your recursive function. Check for unintended circular calls between functions.",
  },

  // === Syntax / Module Errors ===
  {
    pattern: /Unexpected token/i,
    title: "Syntax Error",
    explanation:
      "The JavaScript parser found a character it didn't expect. This usually means a missing bracket, comma, or quote somewhere.",
    suggestion:
      "Check the file around the reported line for missing or extra brackets, commas, semicolons, or quotes.",
  },
  {
    pattern: /Cannot find module '(.+)'/i,
    title: "Module Not Found",
    explanation:
      "Node.js couldn't find the module you tried to import. Either the package isn't installed, the file path is wrong, or the module name is misspelled.",
    suggestion:
      "Run npm install to ensure all dependencies are installed. Check the import path for typos.",
  },
  {
    pattern: /SyntaxError: .* is not valid JSON/i,
    title: "Invalid JSON",
    explanation:
      "Your code tried to parse a string as JSON, but the string isn't valid JSON. This often happens when an API returns HTML (like an error page) instead of JSON.",
    suggestion:
      "Log the raw response before parsing. Check that the API endpoint is correct and returning JSON.",
  },

  // === Network & HTTP Errors ===
  {
    pattern: /ECONNREFUSED/i,
    title: "Connection Refused",
    explanation:
      "Your app tried to connect to a server that isn't accepting connections. The target service is either not running, listening on a different port, or blocked by a firewall.",
    suggestion: "Make sure the target service is running and listening on the expected host:port.",
  },
  {
    pattern: /ECONNRESET/i,
    title: "Connection Reset",
    explanation:
      "The remote server abruptly closed the connection. This can happen due to server crashes, timeouts, or network issues.",
    suggestion: "Add retry logic with backoff. Check the remote server's logs for errors.",
  },
  {
    pattern: /ETIMEDOUT/i,
    title: "Connection Timed Out",
    explanation:
      "The connection to the remote server took too long and was abandoned. The server might be overloaded or unreachable.",
    suggestion: "Increase the timeout, check network connectivity, or add retry logic.",
  },
  {
    pattern: /ENOTFOUND/i,
    title: "DNS Lookup Failed",
    explanation:
      "The hostname couldn't be resolved to an IP address. The domain name is wrong or DNS is not working.",
    suggestion: "Check the hostname for typos. Verify DNS resolution is working.",
  },
  {
    pattern: /EADDRINUSE/i,
    title: "Port Already in Use",
    explanation: "Your app tried to listen on a port that's already taken by another process.",
    suggestion: "Use a different port, or find and stop the process using that port: lsof -i :PORT",
  },
  {
    pattern: /fetch failed|Failed to fetch/i,
    title: "Fetch Failed",
    explanation:
      "A network request failed completely. This usually means the server is unreachable, CORS blocked the request, or there's no internet connection.",
    suggestion:
      "Check that the URL is correct, the server is running, and CORS is configured if calling from a browser.",
  },
  {
    pattern: /Network request failed/i,
    title: "Network Error",
    explanation:
      "A network request could not complete. The server may be down, the URL may be wrong, or the network may be unavailable.",
    suggestion: "Verify the target URL and network connectivity.",
  },
  {
    pattern: /status code 4\d{2}/i,
    title: "Client Error (4xx)",
    explanation:
      "The server rejected the request due to a client-side issue — bad request data, missing auth, or accessing a resource that doesn't exist.",
    suggestion: "Check the request URL, headers, authentication, and body for correctness.",
  },
  {
    pattern: /status code 5\d{2}/i,
    title: "Server Error (5xx)",
    explanation: "The server encountered an internal error while processing the request.",
    suggestion: "Check the server logs for the root cause. This is a backend issue.",
  },

  // === Database Errors ===
  {
    pattern: /ER_DUP_ENTRY|duplicate key|unique constraint/i,
    title: "Duplicate Entry",
    explanation:
      "A database insert or update violated a unique constraint — you're trying to insert data that already exists.",
    suggestion: "Use upsert/ON CONFLICT, or check for existing records before inserting.",
  },
  {
    pattern: /ER_NO_SUCH_TABLE|relation .* does not exist|no such table/i,
    title: "Table Not Found",
    explanation: "The query references a database table that doesn't exist.",
    suggestion: "Run your database migrations. Check that the table name is spelled correctly.",
  },
  {
    pattern: /ER_PARSE_ERROR|syntax error at or near/i,
    title: "SQL Syntax Error",
    explanation: "Your SQL query has a syntax error.",
    suggestion: "Check the SQL query for typos, missing commas, or incorrect keywords.",
  },
  {
    pattern: /SQLITE_BUSY/i,
    title: "Database Busy",
    explanation:
      "SQLite couldn't acquire a lock because another connection is writing. This happens with concurrent writes.",
    suggestion: "Enable WAL mode, reduce write contention, or add retry logic.",
  },
  {
    pattern: /connection.*refused.*database|Can't connect to/i,
    title: "Database Connection Failed",
    explanation:
      "Your app couldn't connect to the database server. The database might not be running or the connection string is wrong.",
    suggestion:
      "Verify the database is running and the connection string (host, port, credentials) is correct.",
  },

  // === React / Frontend Errors ===
  {
    pattern: /Minified React error #(\d+)/i,
    title: "React Production Error",
    explanation:
      "React threw an error in production mode. The error is minified — check the React error decoder for details.",
    suggestion:
      "Look up the error number at https://reactjs.org/docs/error-decoder.html for the full message.",
  },
  {
    pattern: /Hydration failed|Text content does not match|did not match/i,
    title: "Hydration Mismatch",
    explanation:
      "The HTML rendered on the server doesn't match what React tried to render on the client. This causes the page to re-render completely.",
    suggestion:
      "Ensure server and client render identical output. Avoid using Date.now(), Math.random(), or browser-only APIs during initial render.",
  },
  {
    pattern: /Invalid hook call/i,
    title: "Invalid React Hook Call",
    explanation:
      "A React hook was called outside of a function component, or you have multiple copies of React in your bundle.",
    suggestion:
      "Only call hooks at the top level of function components. Check for duplicate React versions with npm ls react.",
  },
  {
    pattern: /Objects are not valid as a React child/i,
    title: "Invalid React Child",
    explanation: "You tried to render a plain object as a React child, which isn't allowed.",
    suggestion:
      "Convert the object to a string (JSON.stringify) or render its properties individually.",
  },
  {
    pattern: /Each child in a list should have a unique "key" prop/i,
    title: "Missing React Key",
    explanation:
      "When rendering a list of elements, each item needs a unique key prop for React's reconciliation algorithm.",
    suggestion: "Add a unique key prop to each item. Use a stable ID, not array index.",
  },
  {
    pattern: /ResizeObserver loop/i,
    title: "ResizeObserver Loop",
    explanation:
      "A ResizeObserver callback caused another resize, creating an infinite loop. This is usually harmless but noisy.",
    suggestion: "This is often safe to ignore. If it causes issues, debounce the resize handler.",
  },

  // === Authentication / Authorization ===
  {
    pattern: /jwt (expired|malformed|invalid)/i,
    title: "JWT Error",
    explanation:
      "The JSON Web Token is invalid — it may be expired, malformed, or signed with the wrong key.",
    suggestion: "Check token expiration, refresh the token, or verify the signing key matches.",
  },
  {
    pattern: /unauthorized|401/i,
    title: "Unauthorized",
    explanation: "The request lacks valid authentication credentials.",
    suggestion: "Ensure the auth token is present and valid. Check for expired sessions.",
  },
  {
    pattern: /forbidden|403/i,
    title: "Forbidden",
    explanation:
      "The server understood the request but refuses to authorize it. The user doesn't have permission.",
    suggestion: "Check user permissions and roles. Verify the user has access to this resource.",
  },

  // === CORS ===
  {
    pattern: /CORS|Access-Control-Allow-Origin|cross-origin/i,
    title: "CORS Error",
    explanation:
      "The browser blocked a request to a different origin because the server didn't include the right CORS headers.",
    suggestion:
      "Configure the server to send Access-Control-Allow-Origin headers. For development, use a proxy or cors middleware.",
  },

  // === Memory ===
  {
    pattern: /heap out of memory|ENOMEM|JavaScript heap/i,
    title: "Out of Memory",
    explanation:
      "The process ran out of available memory. This could be a memory leak or processing too much data at once.",
    suggestion:
      "Increase memory limit with --max-old-space-size, check for memory leaks, or process data in chunks.",
  },
  {
    pattern: /memory usage.*threshold|high memory/i,
    title: "High Memory Usage",
    explanation: "The application's memory usage has exceeded the warning threshold.",
    suggestion:
      "Monitor for memory leaks. Consider restarting the process periodically or increasing available memory.",
  },

  // === File System ===
  {
    pattern: /ENOENT|no such file or directory/i,
    title: "File Not Found",
    explanation: "Your code tried to access a file or directory that doesn't exist.",
    suggestion: "Check the file path for typos. Ensure the file exists before accessing it.",
  },
  {
    pattern: /EACCES|permission denied/i,
    title: "Permission Denied",
    explanation: "The process doesn't have permission to access the file or resource.",
    suggestion: "Check file permissions. Run with appropriate user/group or fix file ownership.",
  },
  {
    pattern: /EMFILE|too many open files/i,
    title: "Too Many Open Files",
    explanation:
      "The process has opened more files than the OS allows. This often indicates a file descriptor leak.",
    suggestion: "Close files after use. Increase the ulimit, or check for leaked file descriptors.",
  },

  // === Timeout ===
  {
    pattern: /timeout|timed out|ESOCKETTIMEDOUT/i,
    title: "Operation Timed Out",
    explanation:
      "An operation took too long and was cancelled. The target service might be slow or overloaded.",
    suggestion:
      "Increase the timeout value, add retry logic, or investigate why the operation is slow.",
  },

  // === Encoding / Parsing ===
  {
    pattern: /URIError|URI malformed/i,
    title: "Malformed URI",
    explanation: "A URL encoding/decoding operation received an invalid URI.",
    suggestion:
      "Check the input for invalid characters. Use encodeURIComponent/decodeURIComponent correctly.",
  },
  {
    pattern: /RangeError.*Invalid array length/i,
    title: "Invalid Array Length",
    explanation: "An array was created with an invalid length (negative or too large).",
    suggestion: "Check the value being used as the array length.",
  },

  // === Catch-all ===
  {
    pattern: /TypeError/i,
    title: "Type Error",
    explanation:
      "A value is not the type that was expected. This often means using the wrong method on the wrong data type.",
    suggestion:
      "Check what type the variable actually is (using typeof or console.log) and handle it appropriately.",
  },
  {
    pattern: /ReferenceError/i,
    title: "Reference Error",
    explanation: "Your code references something that doesn't exist in the current scope.",
    suggestion: "Check for typos, missing imports, or variables used outside their scope.",
  },
  {
    pattern: /SyntaxError/i,
    title: "Syntax Error",
    explanation: "The code has a syntax error that prevents it from being parsed.",
    suggestion:
      "Check for missing brackets, quotes, commas, or other syntax issues around the reported location.",
  },
];
