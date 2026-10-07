// Asked before anything that cannot be undone. A browser has its own way of asking.
import { Alert, Platform } from "react-native";

export function confirm(title: string, text: string, action: string): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(globalThis.confirm(text ? `${title}\n\n${text}` : title));
  return new Promise((resolve) => Alert.alert(title, text || undefined, [
    { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
    { text: action, style: "destructive", onPress: () => resolve(true) },
  ], { cancelable: true, onDismiss: () => resolve(false) }));
}
