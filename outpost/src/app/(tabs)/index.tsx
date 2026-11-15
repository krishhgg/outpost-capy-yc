import { View } from "react-native";
import { Base } from "../../Base";
import { WithDevice } from "../../session";

export default function BaseScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#07080B" }}>
      <WithDevice>{device => <Base device={device} />}</WithDevice>
    </View>
  );
}
