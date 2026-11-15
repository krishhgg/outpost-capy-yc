import { View } from "react-native";
import { Bounties } from "../../Bounties";
import { WithDevice } from "../../session";

export default function BountiesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#07080B" }}>
      <WithDevice>{device => <Bounties device={device} />}</WithDevice>
    </View>
  );
}
