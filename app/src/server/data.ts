import { type MiddlewareConfigFn } from "wasp/server";

export const getSomeData = async () => {
  return {
    someData: "Hello from the server!",
  };
};

export const getGlobalMiddleware: MiddlewareConfigFn = (config) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const clientUrl = process.env.WASP_WEB_CLIENT_URL ?? "http://localhost:3000";

  // Allow all origins in development, otherwise only allow the client URL and both www/non-www versions
  const origin = isDevelopment ? "*" : [clientUrl, "https://applify.ltd", "https://www.applify.ltd"];

  // Remove the default setup and provide a new custom setup for the CORS middleware
  config.delete("cors");
  
  // Set custom CORS configuration
  config.set("cors", (req: any, res: any, next: any) => {
    const requestOrigin = req.headers.origin;
    
    if (isDevelopment || 
        origin === "*" || 
        (Array.isArray(origin) && origin.includes(requestOrigin))) {
      res.header("Access-Control-Allow-Origin", requestOrigin || "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  return config;
};