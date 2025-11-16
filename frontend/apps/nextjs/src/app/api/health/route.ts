const healthCheckHandler = () => {
  return Response.json({ status: "ok" })
}

export { healthCheckHandler as GET }
