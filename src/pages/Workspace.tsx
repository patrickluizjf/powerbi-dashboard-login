import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FileText, Calendar, ExternalLink } from "lucide-react";

interface Report {
  id: string;
  name: string;
  embedUrl: string;
  modifiedDateTime: string;
}

const Workspace = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("pbi_token");
    const groupId = localStorage.getItem("pbi_group_id");

    if (!token || !groupId) {
      navigate("/");
      return;
    }

    const fetchReports = async () => {
      try {
        const response = await fetch(
          `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }

        const data = await response.json();
        setReports(data.value);
      } catch (error) {
        toast.error("Failed to fetch workspace reports");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("pbi_token");
    localStorage.removeItem("pbi_group_id");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container max-w-6xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold">Workspace Reports</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Log Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-lg line-clamp-1">
                      {report.name}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="w-4 h-4 mr-1" />
                      <span>Report</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    Modified:{" "}
                    {new Date(report.modifiedDateTime).toLocaleDateString()}
                  </span>
                </div>

                <a
                  href={report.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full px-4 py-2 mt-4 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Report
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reports found in this workspace</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Workspace;