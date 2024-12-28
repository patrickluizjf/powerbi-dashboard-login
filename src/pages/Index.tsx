import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Index = () => {
  const [credentials, setCredentials] = useState({
    clientId: "",
    clientSecret: "",
    tenantId: "",
    workspaceId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tokenUrl = `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`;
      const formData = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: "https://analysis.windows.net/powerbi/api/.default",
      });

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Authentication failed');
      }

      const tokenData = await response.json();
      localStorage.setItem("pbi_token", tokenData.access_token);
      localStorage.setItem("pbi_group_id", credentials.workspaceId);
      
      toast.success("Successfully authenticated!");
      navigate("/workspace");
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">PowerBI Workspace Viewer</h1>
            <p className="text-muted-foreground">
              Enter your credentials to access your workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client ID</label>
              <input
                type="text"
                className="input-field"
                value={credentials.clientId}
                onChange={(e) =>
                  setCredentials({ ...credentials, clientId: e.target.value })
                }
                placeholder="Enter your client ID"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Client Secret</label>
              <input
                type="password"
                className="input-field"
                value={credentials.clientSecret}
                onChange={(e) =>
                  setCredentials({ ...credentials, clientSecret: e.target.value })
                }
                placeholder="Enter your client secret"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tenant ID</label>
              <input
                type="text"
                className="input-field"
                value={credentials.tenantId}
                onChange={(e) =>
                  setCredentials({ ...credentials, tenantId: e.target.value })
                }
                placeholder="Enter your tenant ID"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace ID</label>
              <input
                type="text"
                className="input-field"
                value={credentials.workspaceId}
                onChange={(e) =>
                  setCredentials({ ...credentials, workspaceId: e.target.value })
                }
                placeholder="Enter your workspace ID"
                required
              />
            </div>

            <button
              type="submit"
              className="button-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Log In"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;