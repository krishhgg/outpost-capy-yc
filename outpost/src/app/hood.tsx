import { View } from "react-native";
import { Hood } from "../Hood";
import { WithDevice } from "../session";
import { DEEP } from "../pixel";

export default function HoodScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: DEEP }}>
      <WithDevice>{device => <Hood device={device} />}</WithDevice>
    </View>
  );
}
