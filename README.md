# OPC UA Application Tagger

This app runs as a module on IoT Edge, adjacent to an OPC UA Publisher.
It intercepts OPC UA messages and inserts to the payload a list of applications that have subscribed to the tag in the payload.
This information is used later at IoT Hub to trigger Event Grid. This triggering can be then specified as per the desired architecture outcome. 
An example could be to have an Event Hub per application, which can then be further used as event source for Time Series Insights.

The module exposes Direct Methods to retrieve the list of Applications and add Tags to the subscription List.
- GetAppSubscritions:<{}>
- SetAppSubscription:<{ApplicationUri, TagName}>

The ApplicatioUri must match the ApplicationUri information element as reported by the Asset (OPC UA Server) and the TagName must match the tag's DisplayName used when provisioning the OPC UA Publisher

