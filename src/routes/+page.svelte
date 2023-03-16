<script>
	import QRCode from "qrcode";
	import QrDashboard from "$lib/components/QRDashboard.svelte";
	import ShareButton from '$lib/components/ShareButton.svelte';
	import { fade } from 'svelte/transition';
	import * as d3 from 'd3';

  	let showNotification = false;

	let inputText = "";
	let qrCodeImage;
	let qrCodeOptions = {
		errorCorrectionLevel: "M",
		type: "image/png",
		quality: 0.92,
		margin: 4,
		scale: 4,
	};

	let data;
    let uniqueId;

	function drawChart(data) {
  console.log(data);
  // Remove any existing SVG elements
  d3.select("#chart")
    .selectAll("svg")
    .remove();

  // Set the dimensions and margins of the graph
	const margin = { top: 30, right: 30, bottom: 90, left: 60 }; // Increase bottom margin to accommodate larger x-axis labels
	const width = 600 - margin.left - margin.right;
	const height = 400 - margin.top - margin.bottom;

  // Aggregate the data by date
  const clicksByDate = new Map();
  data.forEach((d) => {
    const date = d.clicked_at.split("T")[0];
    clicksByDate.set(date, (clicksByDate.get(date) || 0) + 1);
  });

  // Convert the aggregated data to an array
  const aggregatedData = Array.from(clicksByDate, ([date, count]) => ({ date, count }));

  // Create the SVG element
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set the scale for the x-axis
  const x = d3
    .scaleBand()
    .domain(aggregatedData.map((d) => d.date))
    .range([0, width])
    .padding(0.2);

  // Add the x-axis to the chart
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,10)rotate(-45)")
    .style("text-anchor", "end");

  // Set the scale for the y-axis
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(aggregatedData, (d) => d.count)])
    .range([height, 0])
    .nice(); // Make y-axis have only unique integers

  // Add the y-axis to the chart
  svg.append("g").call(
    d3
      .axisLeft(y)
      .tickFormat(d3.format("d")) // Format tick labels as whole numbers
      .ticks(aggregatedData.length) // Limit the number of ticks
  );

  // Generate the density plot
  const line = d3
    .line()
    .x((d) => x(d.date) + x.bandwidth() / 2)
    .y((d) => y(d.count))
    .curve(d3.curveBasis); // Smooth the line

  // Create a gradient for the line
  const gradient = svg
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("y1", y(0))
    .attr("x2", 0)
    .attr("y2", y(d3.max(aggregatedData, (d) => d.count)));

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#3b82f6"); // blue-400

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#9333ea"); // indigo-500

  // Add the density plot path to the chart
  svg.append("path")
    .datum(aggregatedData)
    .attr("stroke", "url(#gradient)")
    .attr("stroke-width", 3)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("fill", "none")
    .attr("d", line);

  // Create a tooltip div
  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("visibility", "hidden");

  // Add circles to the line
svg.selectAll("circle")
  .data(aggregatedData)
  .enter()
  .append("circle")
  .attr("cx", (d) => x(d.date) + x.bandwidth() / 2)
  .attr("cy", (d) => y(d.count))
  .attr("r", 4)
  .attr("fill", (d, i) => {
    const color = d3.interpolateRgb(
      d3.rgb(59, 130, 246), // from-blue-400 #3b82f6
      d3.rgb(147, 51, 234) // to-indigo-500 #9333ea
    );
    return color(i / aggregatedData.length);
  });

// Add invisible larger circles for easier hovering
svg.selectAll(".hover-circle")
  .data(aggregatedData)
  .enter()
  .append("circle")
  .attr("class", "hover-circle")
  .attr("cx", (d) => x(d.date) + x.bandwidth() / 2)
  .attr("cy", (d) => y(d.count))
  .attr("r", 10) // Increase the radius for a larger hover area
  .attr("fill", "transparent") // Make the circle invisible
  .on("mouseover", (event, d) => {
    tooltip
      .style("visibility", "visible")
      .html(`Date: ${d.date}<br/>Scans: ${d.count}`);
  })
  .on("mousemove", (event) => {
    tooltip
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY + 10 + "px");
  })
  .on("mouseout", () => {
    tooltip.style("visibility", "hidden");
  });

// Style the chart for a slick appearance
svg.selectAll("text")
.style("font-family", "Arial, sans-serif")
.style("font-size", "12px");

svg.selectAll("line")
.attr("stroke", "#d3d3d3")
.attr("stroke-width", 1);

svg.selectAll("path.domain")
.attr("stroke", "#d3d3d3")
.attr("stroke-width", 1);
}


	function handleDataFetched(event) {
		data = event.detail.data;
		uniqueId = event.detail.uniqueId;
		drawChart(data);
	}

	let expression = /^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$/;
	const webRegex = new RegExp(expression);
	// Initialise null value for uniqueId

	$: showRetrievalTab = true;
	$: showUniqueId = false;
	$: client_validation = inputText.match(webRegex) ? true : false;
	$: warning = showUniqueId && client_validation ? true : false;

	async function generateQRCode() {
		if (client_validation) {
			try {
				uniqueId = `qr-${Date.now()}-${Math.random()
					.toString(36)
					.substr(2, 8)}`;
				console.log(uniqueId);
				const redirectUrl = new URL("/api/click", location.origin);
				redirectUrl.searchParams.set("target_url", inputText);
				redirectUrl.searchParams.set("unique_id", uniqueId);
				const dataUrl = await QRCode.toDataURL(
					redirectUrl.toString(),
					qrCodeOptions
				);
				qrCodeImage = dataUrl;
				console.log(redirectUrl.toString())
			} catch (err) {
				console.error(err);
			}
		}
	}

	function enableInput() {
		warning = false;
		showUniqueId = false;
	}

	function copyToClipboard() {
    navigator.clipboard
      .writeText(uniqueId)
      .then(() => {
        console.log("Copied to clipboard");
        showNotification = true;
        setTimeout(() => {
          showNotification = false;
        }, 2000);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  	}

	function saveImage() {
		if (qrCodeImage) {
		const link = document.createElement("a");
		link.href = qrCodeImage;
		link.download = uniqueId + ".png";
		link.click();
		}
	}

	function downloadCSV() {
        const csvData = `id,clicked_at,target_url\n${data.map(obj => `${obj.id},${obj.clicked_at},${obj.target_url}`).join('\n')}`;
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', uniqueId + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
</script>
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 w-full px-6 py-12 sm:py-24">
	<aside class="min-h-screen w-full flex flex-col justify-start">
		<div class="relative py-3 sm:max-w-xl w-full">
			<div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 rounded-3xl -z-0"></div>
			<div class="relative min-h-[content] px-4 py-10 bg-white shadow-lg rounded-3xl sm:p-20 !z-20">
			<div class="flex items-start absolute top-0 -translate-y-[2.98rem] !z-10">
				<button
				on:click={() => (showRetrievalTab = true)}
				class="tab border-none px-6 py-3 font-semibold text-gray-700 hover:opacity-95 rounded-t-lg {showRetrievalTab ? 'bg-white' : 'text-gray-700  bg-gray-200'} transition-colors duration-150"
				>
				Generator
				</button>
				<button
				on:click={() => (showRetrievalTab = false)}
				class="tab px-6 py-3 font-semibold text-gray-700  hover:opacity-95 transition-opacity rounded-t-lg {!showRetrievalTab ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'} transition-colors duration-150"
				>
				Retrieve data
				</button>
			</div>
				{#if showRetrievalTab === true}
					<div class = "h-72">
					<div class="flex w-72 flex-col items-end gap-6">
						<div class="relative h-11 w-full min-w-[200px] mb-6">
							<input
							  class="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-pink-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
							  placeholder=" "
							  bind:value={inputText}
							  on:input={generateQRCode}
							  disabled={warning}
							/>
							<label class="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-pink-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-pink-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-pink-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
								URL
							</label>
						  </div>
						
					</div>
					<div class="relative mb-5">
						<select 
						id="errorCorrectionLevel"
						bind:value={qrCodeOptions.errorCorrectionLevel}
						on:change={generateQRCode}
							class="peer h-full w-full rounded-[7px] border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 empty:!bg-red-500 focus:border-2 focus:border-pink-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50">
							<option value="L">L</option>
							<option value="M">M</option>
							<option value="Q">Q</option>
							<option value="H">H</option>
						</select>
						<label class="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-pink-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-pink-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-pink-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
							Select error correction level
						</label>
					</div>
					<div class="mb-5">
						<div class="relative h-10 w-full min-w-[200px]">
							<input
							class="peer h-full w-full rounded-[7px] border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-pink-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
							placeholder=" "
							type="number"
							id="scale"
							min="1"
							max="10"
							bind:value={qrCodeOptions.scale}
							on:input={generateQRCode}
							/>
							<label class="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-pink-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-pink-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-pink-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
							Scale
							</label>
						</div>
					</div>
					</div>
				{:else if showRetrievalTab === false}
					<div class = "h-72">
						<QrDashboard on:data-fetched="{handleDataFetched}"/>
					
					</div>
				{/if}
		</div>
	</aside>
	<div class="xl:col-span-2">						
						{#if showRetrievalTab === true}
						<div class="w-full max-w-[400px] aspect-square relative mb-5 border bg-white rounded-xl">
							{#if webRegex.test(inputText) && qrCodeImage}
							<img
								src={qrCodeImage}
								id="qrCodeImage"
								alt="Generated QR Code"
								class="mx-auto object-fill h-full w-full"
							/>
							<button on:click="{saveImage}" class="bg-blue-500 text-white py-2 px-4 rounded inline">
								<svg class="fill-current w-6 h-6 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
								  <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
								</svg>
								Save
							  </button>
							  
							<ShareButton />
							<div class="relative flex h-10 w-full min-w-[200px] max-w-[400px]">
								<input
									id="user-id"
									type="text"
								class="peer h-full w-full rounded-[7px] border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-2.5 pr-20 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 disabled:border-0 disabled:bg-blue-gray-50"
								placeholder=" "
								required
								bind:value="{uniqueId}"
								readonly
								tabindex="-1"
								style="pointer-events: none;"
								/>
								<button
								class="!absolute right-1 top-1 z-10 select-none bg-blue-500 text-white py-2 px-4 rounded inline"
								type="button"
								data-ripple-light="true"
								on:click={copyToClipboard}
								>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 -translate-y-[0.12rem] inline">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
								</svg>
								Copy ID						  
								</button>
								<label class="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
									Unique identifier
								</label>
								{#if showNotification}
										<div
										class="absolute right-1 top-12 z-20 flex items-center space-x-2 text-gray-700 rounded px-3 py-2 shadow-sm bg-green-100"
										transition:fade="{{ duration: 300, delay: 0, easing: x => x, css: t => `opacity: ${t}; transform: scale(${t})` }}"
										>
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-gray-700">
											<path stroke-linecap="round" stroke-linejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
										</svg>								  
										<span class="text-xs">Copied to clipboard
										</div>
									{/if}
							</div>
							{/if}
						</div>
		{/if}
		{#if data && data.length > 0 && showRetrievalTab === false}
						<div class="h-fit w-fit py-6 sm:py-12" id="chart"></div>
						<div class="flex flex-col">
							<div class="overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div class="inline-block min-w-full py-2 sm:px-6 lg:px-8">
								<div class="overflow-hidden">
								<table class="min-w-full text-left text-sm font-light">
									<thead class="border-b font-medium dark:border-neutral-500">
									<tr>
										<th scope="col" class="px-6 py-4">ID</th>
										<th scope="col" class="px-6 py-4">Clicked at</th>
										<th scope="col" class="px-6 py-4">Target URL</th>
									</tr>
									</thead>
									<tbody>
									{#each data as row}
									<tr class="border-b transition duration-300 ease-in-out hover:bg-neutral-100 dark:border-neutral-500 dark:hover:bg-neutral-600">
										<td class="whitespace-nowrap px-6 py-4 font-medium">{row.id}</td>
										<td>{row.clicked_at}</td>
										<td>{row.target_url}</td>
									</tr>
									{/each}
									</tbody>
								</table>
								</div>
							</div>
							</div>
						</div>
						<button
							on:click="{downloadCSV}"
							class="right-1 w-fit top-1 z-10 select-none rounded bg-pink-500 py-2 px-4 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none peer-placeholder-shown:pointer-events-none peer-placeholder-shown:bg-blue-gray-500 peer-placeholder-shown:opacity-50 peer-placeholder-shown:shadow-none"
							type="button"
							data-ripple-light="true"
							>
							<svg class="fill-current w-5 h-5 pr-1 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
							<span>CSV</span>
						</button>
					{/if}
	</div>
</div>
<!-- https://www.google.nl -->
