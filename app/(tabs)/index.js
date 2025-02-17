import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, FlatList, Vibration, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Audio } from "expo-av";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [alarmScheduled, setAlarmScheduled] = useState(false);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    async function getPermissions() {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    }
    getPermissions();
  }, []);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  useEffect(() => {
    const checkAlarm = setInterval(async () => {
      const now = new Date();
      const storedTime = await AsyncStorage.getItem("alarmTime");
      if (storedTime) {
        const alarmTime = new Date(JSON.parse(storedTime));
        if (
          now.getHours() === alarmTime.getHours() &&
          now.getMinutes() === alarmTime.getMinutes() &&
          alarmScheduled
        ) {
          triggerAlarm();
          clearInterval(checkAlarm);
        }
      }
    }, 1000);
    return () => clearInterval(checkAlarm);
  }, [alarmScheduled]);

  const triggerAlarm = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Alarm Zamanı!",
        body: tasks.length > 0 ? tasks.join(", ") : "Yapılacaklar listesi boş.",
        sound: "default",
      },
      trigger: null,
    });
    setAlarmScheduled(false);
    Vibration.vibrate();
    const { sound } = await Audio.Sound.createAsync(
      { uri: "https://onlineclock.net/audio/options/default.mp3" },
      { shouldPlay: true }
    );
    setSound(sound);
    await sound.playAsync();
  };

  const scheduleAlarm = async () => {
    Alert.alert(
      "Alarm Kur",
      "Alarmı kurmak istediğinize emin misiniz?",
      [
        { text: "Hayır", style: "cancel" },
        {
          text: "Evet",
          onPress: async () => {
            setAlarmScheduled(true);
            await AsyncStorage.setItem("alarmTime", JSON.stringify(date));
            Alert.alert("Alarm başarıyla kuruldu!");
          },
        },
      ]
    );
  };

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowPicker(false);
  };

  const addTask = () => {
    if (taskInput.trim() !== "") {
      setTasks([...tasks, taskInput]);
      setTaskInput("");
    }
  };

  const removeTask = (index) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212", padding: 20 }}>
      <View style={{ width: "100%", alignItems: "center" }}>
        <Text style={{ color: "white", fontSize: 24, marginBottom: 20 }}>📝 Yapılacaklar</Text>
        <TextInput
          style={{ backgroundColor: "white", width: "80%", padding: 10, borderRadius: 10, marginBottom: 10 }}
          placeholder="Bir görev ekleyin"
          value={taskInput}
          onChangeText={setTaskInput}
        />
        <TouchableOpacity onPress={addTask} style={{ backgroundColor: "#32CD32", padding: 10, borderRadius: 10, marginBottom: 10 }}>
          <Text style={{ color: "white" }}>➕ Görev Ekle</Text>
        </TouchableOpacity>
        <FlatList
          data={tasks}
          renderItem={({ item, index }) => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "white", marginVertical: 5, flex: 1 }}>{item}</Text>
              <TouchableOpacity onPress={() => removeTask(index)}>
                <Text style={{ color: "red", marginLeft: 10 }}>➖</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          style={{ maxHeight: 150, width: "100%" }}
        />
      </View>
      <View style={{ width: "100%", alignItems: "center", marginTop: 20 }}>
        <TouchableOpacity onPress={() => setShowPicker(true)} style={{ backgroundColor: "#1E90FF", padding: 10, borderRadius: 10, marginTop: 10 }}>
          <Text style={{ color: "white" }}>⏰ Saat Seç</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker value={date} mode="time" display="spinner" onChange={handleDateChange} />
        )}
        <TouchableOpacity onPress={scheduleAlarm} style={{ backgroundColor: "#FF4500", padding: 10, borderRadius: 10, marginTop: 10 }}>
          <Text style={{ color: "white" }}>🔔 Alarm Kur</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
