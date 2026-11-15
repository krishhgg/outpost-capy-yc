import { View } from "react-native";
import { You } from "../../You";
import { WithDevice } from "../../session";

export default function YouScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#07080B" }}>
      <WithDevice>{device => <You device={device} />}</WithDevice>
    </View>
  );
}
