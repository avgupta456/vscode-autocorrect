# VSCode Autocorrect

This project was created at YHack Mini 2022, by Abhijit Gupta and Mofeed Nagib. We attempted to use CodeBERT and other large language models to integrate autocorrect into the VSCode IDE. This project is currently a prototype and shouldn't be used in production. 

For local development, run the FastAPI Server on port 5000 (see `/backend` folder). Then open the `vscode/autocorrect` folder in VSCode and activate the extension (Press F5). To generate autocorrect suggestions, create a test file (Python, JavaScript, Java, C, or C++) and enter incorrect code. These errors can be either mechanical (typos) or logical. Move the cursor within a line of the error and alter text to trigger the autocorrect function. 

See below for some examples of the extension at work!

![image](https://user-images.githubusercontent.com/16708871/204194388-8dafd39e-078c-40f3-8757-27b0d867b0bd.png)

![image](https://user-images.githubusercontent.com/16708871/204194445-d033646e-5744-4d47-9ef9-9ea69175694d.png)

![image](https://user-images.githubusercontent.com/16708871/204194511-808f9277-2970-40e9-9911-b2a63bbf30a1.png)

![image](https://user-images.githubusercontent.com/16708871/204194567-33e2ad7d-2aea-48c2-b798-13744ad254b6.png)
