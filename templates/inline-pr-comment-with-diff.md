Compression reduced images by <strong><%- overallPercentageSaved %>%</strong>, saving <strong><%- overallBytesSaved %></strong>.

| Filename | Before | After | Improvement | Visual comparison |
| -------- | ------ | ----- | ----------- | ----------------- |
<% optimisedImages.forEach((image) => { -%>
| <code><%- image.name %></code> | <%- image.formattedBeforeStat %> | <%- image.formattedAfterStat %> | <%- image.formattedPercentChange %> | [View diff](<%- image.diffUrl %>) |
<% }); %>

<% if(unoptimisedImages.length) { -%>
<%- unoptimisedImages.length %> <%- unoptimisedImages.length > 1 ? 'images' : 'image' %> did not require optimisation.
<% } %>