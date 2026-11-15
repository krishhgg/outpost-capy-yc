import { View } from "react-native";
import { Create } from "../Create";
import { WithDevice } from "../session";
import { DEEP } from "../pixel";

export default function CreateScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: DEEP }}>
      <WithDevice>{device => <Create device={device} />}</WithDevice>
    </View>
  );
}
