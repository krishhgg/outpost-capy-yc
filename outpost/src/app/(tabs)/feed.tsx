import { View } from "react-native";
import { useIsFocused, useLocalSearchParams } from "expo-router";
import { Feed } from "../../Feed";
import { WithDevice } from "../../session";

export default function FeedScreen() {
  const focused = useIsFocused();
  // The Base's Scout bubble opens the Feed with ?find=<time>, which brings the Scout card up next.
  const { find } = useLocalSearchParams<{ find?: string }>();
  return (
    <View style={{ flex: 1, backgroundColor: "#07080B" }}>
      <WithDevice>{device => <Feed device={device} active={focused} findNow={find} />}</WithDevice>
    </View>
  );
}
