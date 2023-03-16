<script>
    import { onMount } from 'svelte';
  </script>
  
  <style>
    :global(body) {
      font-family: 'Arial', sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
  
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
  
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  
    h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
  
    p {
      font-size: 1rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
  
    ol {
      list-style-type: decimal;
      padding-left: 2rem;
      margin-bottom: 1rem;
    }
  
    li {
      margin-bottom: 0.5rem;
    }
  </style>
  
  <div class="container">
    <h1>How to Use the QR Code Generator and Data Retrieval Application</h1>
    <h2>Generate and Save QR Code</h2>
    <p>Follow these steps to generate a QR code and save it:</p>
    <ol>
      <li>Find the input field labeled "Scale" in the user interface...</li>
      <li>After setting the scale, the application will generate the QR code...</li>
      <li>To save the QR code image, click the "Save" button...</li>
    </ol>
    
    <h2>Retrieve and Manage Data</h2>
    <p>Follow these steps to retrieve and manage data related to the generated QR code:</p>
    <ol>
      <li>In the user interface, locate the input field labeled "Unique identifier"...</li>
      <li>To copy the unique ID to your clipboard, click the "Copy ID" button...</li>
      <li>The application displays a table with data related to your QR code...</li>
      <li>To download the data in CSV format, click the "CSV" button...</li>
    </ol>
  </div>
  