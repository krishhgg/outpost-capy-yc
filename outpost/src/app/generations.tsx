import { View } from "react-native";
import { Generations } from "../Generations";
import { WithDevice } from "../session";
import { DEEP } from "../pixel";

export default function GenerationsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: DEEP }}>
      <WithDevice>{device => <Generations device={device} />}</WithDevice>
    </View>
  );
}
