export interface PurchaseNotification {
  product: string;
  amount: string | number;
  project_id?: number | string | null;
  project_name?: string | null;
  network?: "mainnet" | "testnet" | string;
  tx_hash?: string;
}

/**
 * Post a purchase notification to DISCORD_PAYMENTS_WEBHOOK_URL.
 * No-op when the environment variable is unset.
 * Never throws so webhook failures cannot break checkout.
 */
export async function notifyPurchase(payment: PurchaseNotification): Promise<void> {
  const webhookUrl = process.env.DISCORD_PAYMENTS_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return;
  }

  try {
    const projectLabel = payment.project_name
      ? `${payment.project_name} (#${payment.project_id ?? "N/A"})`
      : payment.project_id != null
        ? `#${payment.project_id}`
        : "N/A";

    const fields = [
      { name: "Product", value: String(payment.product), inline: true },
      { name: "Amount", value: `${payment.amount} XLM`, inline: true },
      { name: "Project", value: projectLabel, inline: true },
    ];

    if (payment.network) {
      fields.push({ name: "Network", value: String(payment.network), inline: true });
    }

    if (payment.tx_hash) {
      fields.push({ name: "Transaction", value: `\`${payment.tx_hash}\``, inline: false });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            title: "New Payment Recorded",
            color: 0x00d4aa,
            fields,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        `Discord payments webhook responded with status ${response.status} ${response.statusText}`,
      );
    }
  } catch (err) {
    console.error("Failed to send Discord purchase notification:", err);
  }
}
