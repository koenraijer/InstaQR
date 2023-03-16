import { createClient } from "@supabase/supabase-js";
import { redirect } from '@sveltejs/kit';

const supabaseUrl = "https://brbjkaqsnhcdiocxkknj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmprYXFzbmhjZGlvY3hra25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg5MDcwNDYsImV4cCI6MTk5NDQ4MzA0Nn0.97LVmVfBY46QYVpv8loYiFE3C4cN0ylrB9ehaM1fdLo";
const supabase = createClient(supabaseUrl, supabaseKey);

import UAParser from "ua-parser-js";

export async function GET({ url, request }) {
  const target_url = url.searchParams.get("target_url");
  const unique_id = url.searchParams.get("unique_id");

  // Parse the user agent string from the request headers
  const userAgentString = request.headers.get("user-agent");
  const parser = new UAParser(userAgentString);

  // Extract the device type, browser, and operating system information
  const device_type = parser.getDevice().model;
  const browser_info = parser.getBrowser();
  const os_info = parser.getOS();

  try {
    const { error } = await supabase.from("qr_clicks").insert([
      {
        target_url,
        clicked_at: new Date(),
        unique_id,
        device_type,
        browser_info: `${browser_info.name} ${browser_info.version}`, // Save browser name and version
        os_info: `${os_info.name} ${os_info.version}`, // Save operating system name and version
      },
    ]);

    if (error) {
      throw error;
    }
    console.log("Redirect_url: " + target_url);

    const response = new Response(null, {
      status: 303,
      headers: {
        Location: target_url,
      },
    });
    return response;
  } catch (error) {
    console.error("Error registering click:", error);

    return {
      status: 500,
      body: { message: "Error registering click", error },
    };
  }
}