import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubscriptionStatus,
  createCheckoutSession,
  cancelSubscription,
  reactivateSubscription,
} from "../services/subscription";

export function SubscriptionPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const result = await getSubscriptionStatus();
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (result) => {
      if (result.success && result.url) {
        window.location.href = result.url;
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      }
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateSubscription,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="screen">
        <div className="loading">
          <div className="spinner" />
          Loading subscription status...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen">
        <div className="alert alert-error">
          Failed to load subscription status
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <Link to="/library" className="btn btn-outline btn-sm">
          ← Back
        </Link>
        <h1 className="title">Premium</h1>
        <div style={{ width: "80px" }} />
      </div>

      {/* Current Status */}
      <div className="card" style={{ maxWidth: "600px", marginBottom: "var(--space-xl)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-lg)" }}>
          <h2 className="subtitle">Current Status</h2>
          <span className={`badge ${data?.isPremium ? "badge-purple" : "badge-outline"}`}>
            {data?.isPremium ? "Premium" : "Free"}
          </span>
        </div>

        {data?.subscription && (
          <div>
            <div style={{ marginBottom: "var(--space-md)" }}>
              <strong>Status:</strong>{" "}
              <span className={`badge ${data.subscription.status === "active" ? "badge-cyan" : "badge-coral"}`}>
                {data.subscription.status}
              </span>
            </div>
            <div style={{ marginBottom: "var(--space-md)" }}>
              <strong>Current Period Ends:</strong> {formatDate(data.subscription.currentPeriodEnd)}
            </div>
            {data.subscription.cancelAtPeriodEnd && (
              <div className="alert alert-warning" style={{ marginTop: "var(--space-md)" }}>
                Your subscription will not renew after the current period.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Premium Benefits */}
      {!data?.isPremium && (
        <div className="card" style={{ maxWidth: "600px", marginBottom: "var(--space-xl)" }}>
          <h2 className="subtitle" style={{ marginBottom: "var(--space-lg)" }}>Upgrade to Premium</h2>
          <p style={{ marginBottom: "var(--space-lg)", color: "var(--text-secondary)" }}>
            Get access to premium features:
          </p>
          <div style={{ marginBottom: "var(--space-xl)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--cyan)",
                  border: "2px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✓
              </div>
              <span>Unlimited books in your library</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--purple)",
                  border: "2px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✓
              </div>
              <span>Advanced statistics and insights</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--yellow)",
                  border: "2px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✓
              </div>
              <span>Cloud sync across devices</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--coral)",
                  border: "2px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✓
              </div>
              <span>Priority support</span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? "Redirecting..." : "Subscribe Now"}
          </button>
          {checkoutMutation.isError && (
            <div className="alert alert-error" style={{ marginTop: "var(--space-md)" }}>
              Failed to create checkout session
            </div>
          )}
        </div>
      )}

      {/* Reactivate */}
      {data?.isPremium && data?.subscription?.cancelAtPeriodEnd && (
        <div className="card" style={{ maxWidth: "600px", marginBottom: "var(--space-xl)" }}>
          <h2 className="subtitle" style={{ marginBottom: "var(--space-md)" }}>Reactivate Subscription</h2>
          <p style={{ marginBottom: "var(--space-lg)", color: "var(--text-secondary)" }}>
            Your subscription is set to cancel. Reactivate to keep your premium benefits.
          </p>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => reactivateMutation.mutate()}
            disabled={reactivateMutation.isPending}
          >
            {reactivateMutation.isPending ? "Reactivating..." : "Reactivate Subscription"}
          </button>
        </div>
      )}

      {/* Cancel */}
      {data?.isPremium && !data?.subscription?.cancelAtPeriodEnd && (
        <div className="card" style={{ maxWidth: "600px", borderColor: "var(--coral)" }}>
          <h2 className="subtitle" style={{ marginBottom: "var(--space-md)" }}>Manage Subscription</h2>
          <p style={{ marginBottom: "var(--space-lg)", color: "var(--text-secondary)" }}>
            You can cancel your subscription at any time. You'll keep access until the end of your billing period.
          </p>
          <button
            className="btn btn-danger btn-block"
            onClick={() => {
              if (confirm("Are you sure you want to cancel your subscription?")) {
                cancelMutation.mutate();
              }
            }}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? "Canceling..." : "Cancel Subscription"}
          </button>
        </div>
      )}
    </div>
  );
}
