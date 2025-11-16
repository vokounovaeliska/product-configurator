export const formatDate = (
  date: Date,
  locale = "cs",
  dateFormat: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  },
): string => {
  return new Intl.DateTimeFormat(locale, dateFormat).format(date)
}
