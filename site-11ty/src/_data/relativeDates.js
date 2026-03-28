export default function () {
  const now = new Date();
  return {
    fiveMinAgo: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    twoHoursAgo: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    yesterday: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    lastWeek: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    inOneHour: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
  };
}
