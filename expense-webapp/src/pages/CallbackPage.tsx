import { useEffect, useState } from "react";
import { VStack } from "@astryxdesign/core/Stack";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Text } from "@astryxdesign/core/Text";
import { handleCallback } from "../auth";

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback()
      .then(() => {
        window.location.assign(window.location.origin);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Sign-in failed.");
      });
  }, []);

  return (
    <VStack height="100dvh" hAlign="center" vAlign="center" gap={4}>
      {error ? (
        <Text type="body" color="secondary">
          {error}
        </Text>
      ) : (
        <Spinner size="lg" label="Completing sign-in…" />
      )}
    </VStack>
  );
}
