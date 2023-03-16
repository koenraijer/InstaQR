<script>
  import "../app.postcss";
  import Header from "./Header.svelte";
  import "./styles.css";
</script>
  
  <div class="app flex flex-col min-h-screen">
	<Header />
  
	<main class="flex-1 p-4 w-full mx-auto max-w-screen-2xl">
	  <slot />
	</main>
  
	<footer class="flex flex-col justify-center items-center p-4 bg-gray-100 bg-opacity-90 shadow-inner">
		<a href="#" class="footer-link mb-2">Terms of Service</a>
		<a href="#" class="footer-link mb-2">Privacy Policy</a>
		<p class="text-gray-600">&copy; 2023 FlexiCode. All rights reserved.</p>
	</footer>
  </div>
  
