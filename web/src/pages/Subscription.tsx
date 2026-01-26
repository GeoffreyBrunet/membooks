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
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center py-16 text-gray-500">
          <div className="w-6 h-6 border-3 border-gray-300 border-t-coral rounded-full animate-spin mr-3" />
          Loading subscription status...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg text-red-600">
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
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Link to="/library" className="px-4 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors">
          ← Back
        </Link>
        <h1 className="font-title text-3xl">Premium</h1>
        <div className="w-20" />
      </div>

      {/* Current Status */}
      <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-title text-xl">Current Status</h2>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${data?.isPremium ? "bg-purple text-white" : "border-2 border-gray-300"}`}>
            {data?.isPremium ? "Premium" : "Free"}
          </span>
        </div>

        {data?.subscription && (
          <div className="space-y-3">
            <div>
              <strong>Status:</strong>{" "}
              <span className={`px-2 py-1 text-xs rounded-full ${data.subscription.status === "active" ? "bg-cyan" : "bg-coral"} text-gray-900`}>
                {data.subscription.status}
              </span>
            </div>
            <div>
              <strong>Current Period Ends:</strong> {formatDate(data.subscription.currentPeriodEnd)}
            </div>
            {data.subscription.cancelAtPeriodEnd && (
              <div className="p-3 bg-yellow/20 border-2 border-yellow rounded-lg text-gray-800 mt-4">
                Your subscription will not renew after the current period.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Premium Benefits */}
      {!data?.isPremium && (
        <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md mb-6">
          <h2 className="font-title text-xl mb-6">Upgrade to Premium</h2>
          <p className="text-gray-600 mb-6">Get access to premium features:</p>

          <div className="space-y-4 mb-8">
            {[
              { color: "bg-cyan", text: "Unlimited books in your library" },
              { color: "bg-purple", text: "Advanced statistics and insights" },
              { color: "bg-yellow", text: "Cloud sync across devices" },
              { color: "bg-coral", text: "Priority support" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-8 h-8 ${item.color} border-2 border-gray-900 rounded-full flex items-center justify-center text-sm`}>
                  ✓
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            className="w-full py-3 bg-coral text-gray-900 font-title text-lg border-2 border-gray-900 rounded-lg neo-shadow-md hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
          >
            {checkoutMutation.isPending ? "Redirecting..." : "Subscribe Now"}
          </button>

          {checkoutMutation.isError && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-red-600">
              Failed to create checkout session
            </div>
          )}
        </div>
      )}

      {/* Reactivate */}
      {data?.isPremium && data?.subscription?.cancelAtPeriodEnd && (
        <div className="bg-white border-2 border-gray-900 rounded-xl p-6 neo-shadow-md mb-6">
          <h2 className="font-title text-xl mb-4">Reactivate Subscription</h2>
          <p className="text-gray-600 mb-6">
            Your subscription is set to cancel. Reactivate to keep your premium benefits.
          </p>
          <button
            onClick={() => reactivateMutation.mutate()}
            disabled={reactivateMutation.isPending}
            className="w-full py-3 bg-cyan text-gray-900 font-title border-2 border-gray-900 rounded-lg neo-shadow-md hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
          >
            {reactivateMutation.isPending ? "Reactivating..." : "Reactivate Subscription"}
          </button>
        </div>
      )}

      {/* Cancel */}
      {data?.isPremium && !data?.subscription?.cancelAtPeriodEnd && (
        <div className="bg-white border-2 border-coral rounded-xl p-6 neo-shadow-md">
          <h2 className="font-title text-xl mb-4">Manage Subscription</h2>
          <p className="text-gray-600 mb-6">
            You can cancel your subscription at any time. You'll keep access until the end of your billing period.
          </p>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to cancel your subscription?")) {
                cancelMutation.mutate();
              }
            }}
            disabled={cancelMutation.isPending}
            className="w-full py-3 bg-red-500 text-white font-title border-2 border-gray-900 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {cancelMutation.isPending ? "Canceling..." : "Cancel Subscription"}
          </button>
        </div>
      )}
    </div>
  );
}
