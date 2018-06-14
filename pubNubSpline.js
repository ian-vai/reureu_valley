//================ PubNub Spline Chart =================
pubnub = new PubNub({
  publishKey: "pub-c-21bada81-7471-4558-9011-086d008008c7",
  subscribeKey: "sub-c-80bc6878-de51-11e7-b4b6-6a46027b7961"
});

eon.chart({
  pubnub: pubnub,
  channels: ["node-red-temperature"],
  limit: 20,
  generate: {
    bindto: "#temperature-spline",
    data: {
      labels: true
    },
    size: {
      height: 230
    }
  }
});

eon.chart({
  pubnub: pubnub,
  channels: ["node-red-humidity"],
  limit: 20,
  generate: {
    bindto: "#humidity-spline",
    data: {
      labels: true
    },
    size: {
      height: 230
    }
  }
});
