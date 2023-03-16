<script>
    import { createClient } from "@supabase/supabase-js";
    import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

    const supabaseUrl = "https://brbjkaqsnhcdiocxkknj.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmprYXFzbmhjZGlvY3hra25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg5MDcwNDYsImV4cCI6MTk5NDQ4MzA0Nn0.97LVmVfBY46QYVpv8loYiFE3C4cN0ylrB9ehaM1fdLo";
    const supabase = createClient(supabaseUrl, supabaseKey);

    $: uniqueId = '';
    // @ts-ignore
    $: data = [];

    $: isValid = false
    $: showNoDataError = false
    $: showValidError = false
    
    const dispatch = createEventDispatcher();

    async function fetchData() {
      console.log("fetching data")
      const regex = /^qr-\d{13}-\w+$/  
      isValid = regex.test(uniqueId);
      if (!isValid) {
            showValidError = true;
            setTimeout(() => {
            showValidError = false;
            }, 2000);
            return;
        }
      console.log("passed regex")

      const { data: qrClicks, error } = await supabase
        .from('qr_clicks')
        .select('*')
        .eq('unique_id', uniqueId);
  
      if (error) {
        console.error('Error fetching data:', error);
        showNoDataError = true;
            setTimeout(() => {
            showNoDataError = false;
            }, 2000);
        return;
      }
  
      data = qrClicks;
      if (data.length === 0) {
            showNoDataError = true;
            setTimeout(() => {
            showNoDataError = false;
            }, 2000);
            return;
      }
      console.log("data", data)
      dispatch('data-fetched', { data: qrClicks, uniqueId });
    }

  </script>
  
  <div class="p-4">
    <div class="relative flex h-10 w-full min-w-[200px] max-w-[24rem]">
        <form
        class="relative"
        on:submit|preventDefault="{fetchData}"
        >
        <input
            id="user-id"
            type="text"
            class="peer h-full w-full rounded-[7px] border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-2.5 pr-20 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-pink-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
            placeholder=" "
            required
            bind:value="{uniqueId}"
        />
        <button
            class="!absolute right-1 top-1 z-10 select-none rounded bg-pink-500 py-2 px-4 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none peer-placeholder-shown:pointer-events-none peer-placeholder-shown:bg-blue-gray-500 peer-placeholder-shown:opacity-50 peer-placeholder-shown:shadow-none"
            type="submit"
            data-ripple-light="true"
        >
            Go
        </button>
        </form>


        <label class="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-pink-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-pink-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-pink-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
          Unique identifier
        </label>

        {#if showNoDataError && data.length === 0 && isValid === true}
        <div
        class="absolute right-1 top-12 z-20 flex items-center space-x-2 text-gray-700 rounded px-3 py-2 shadow-sm bg-yellow-100"
        transition:fade="{{ duration: 300, delay: 0, easing: x => x, css: t => `opacity: ${t}; transform: scale(${t})` }}"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-gray-700">
            <!-- Info icon -->
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0-8h.01M6.938 4.968l-.781.783L10.039 9 7.157 11.82l.781.783L12 9l-5.062-4.032z" />
            </svg>
            <span class="text-xs">No data available for this user ID.</span>
        </div>
      {:else if showValidError && data.length === 0 && isValid === false}
        <div
            class="absolute right-1 top-12 z-20 flex items-center space-x-2 text-red-500 rounded px-3 py-2 shadow-sm bg-red-100"
            transition:fade="{{ duration: 300, delay: 0, easing: x => x, css: t => `opacity: ${t}; transform: scale(${t})` }}"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-red-500">
            <!-- Error icon -->
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0-8h.01M6.938 4.968l-.781.783L10.039 9 7.157 11.82l.781.783L12 9l-5.062-4.032z" />
            </svg>
            <span class="text-xs">Please enter a valid user ID.</span>
        </div>
      {/if}
    </div>
  </div>
  