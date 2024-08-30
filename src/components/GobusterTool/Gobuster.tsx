import { Button, LoadingOverlay, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useState } from "react";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { SaveOutputToTextFile_v2 } from "../SaveOutputToFile/SaveOutputToTextFile";
import { UserGuide } from "../UserGuide/UserGuide";

const title = "GoBuster Directory and File Brute-Forcing Tool";
const description_userguide =
    "GoBuster is a tool used for directory and file brute-forcing on web servers. It can be used to discover hidden directories and files on a web server by trying different combinations of URLs. You can find more information about the tool, including usage instructions and examples, in its official documentation: https://github.com/OJ/gobuster";

/**
 * Represents the form values for the AirbaseNG component.
 */
interface FormValuesType {
    url: string;
    wordlist: string;
}

/**
 * The GoBuster component.
 * @returns The GoBuster component.
 */
const GoBusterTool = () => {
    //Component State Variables.
    const [loading, setLoading] = useState(false); // State variable to indicate loading state.
    const [output, setOutput] = useState(""); // State variable to store the output of the command execution.
    const [pid, setPid] = useState(""); // State variable to store the process ID of the command execution.
    const [allowSave, setAllowSave] = useState(false); // State variable to allow saving of output
    const [hasSaved, setHasSaved] = useState(false); // State variable to indicate if output has been saved


    // Component Constants.
    const title = "GoBuster"; // Title of the component.
    const description = "GoBuster is a tool for directory and file brute-forcing on web servers."; // Description of the component.
    const steps =
        "Step 1: Type in the name of your fake host.\n" +
        "Step 2: Select your desired channel.\n" +
        "Step 3: Specify the WLAN interface to be used.\n" +
        "Step 4: Click 'Start AP' to begin the process.\n" +
        "Step 5: View the output block to see the results. "; // Steps to undertake to use the tool.
    const sourceLink = ""; // Link to the source code (or Kali Tools).
    const tutorial = ""; // Link to the official documentation/tutorial.
    const dependencies = ["gobuster"]; // Contains the dependencies required by the component.

    // Form hook to handle form input.
    const form = useForm({
        initialValues: {
            url: "",
            wordlist: "",
        },
    });


    /** 
    // Uses the callback function of runCommandGetPidAndOutput to handle and save data
    // generated by the executing process into the output state variable.
    */
    const handleProcessData = useCallback((data: string) => {
        setOutput((prevOutput) => prevOutput + "\n" + data); // Update output
    }, []);


    /**
    // Uses the onTermination callback function of runCommandGetPidAndOutput to handle
    // the termination of that process, resetting state variables, handling the output data,
    // and informing the user.
     */
    const handleProcessTermination = useCallback(
        ({ code, signal }: { code: number; signal: number }) => {
            if (code === 0) {
                handleProcessData("\nProcess completed successfully.");
            } else if (signal === 15) {
                handleProcessData("\nProcess was manually terminated.");
            } else {
                handleProcessData(`\nProcess terminated with exit code: ${code} and signal code: ${signal}`);
            }
            // Clear the child process pid reference
            setPid("");
            // Cancel the Loading Overlay
            setLoading(false);

            // Allow Saving as the output is finalised
            setAllowSave(true);
            setHasSaved(false);
        },
        [handleProcessData]
    );


     /**
     * Handles form submission for the GoBuster component.
     */
    const onSubmit = async (values: FormValuesType) => {
        // Disallow saving until the tool's execution is complete
        setAllowSave(false);
        setLoading(true);
        const args = ["dir", "-u", values.url, "-w", values.wordlist];

        try {
            const result = await CommandHelper.runCommandGetPidAndOutput(
                "gobuster",
                args,
                handleProcessData,
                handleProcessTermination
            );
            setPid(result.pid);
            setOutput(result.output);
        } catch (e: any) {
            setOutput(e.message);
        }

        setLoading(false);
    };
    
    /**
    Actions taken after saving the outtpu
     */
    const handleSaveComplete = () => {
        // Indicating that the file has saved which is passed
        // back into SaveOutputToTextFile to inform the user
        setHasSaved(true);
        setAllowSave(false);
    };

    /**
     * Clears the output state.
     */
    const clearOutput = useCallback(() => {
        setOutput("");

        // reset save state variables to defaults
        setHasSaved(false);
        setAllowSave(false);
    }, [setOutput]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <LoadingOverlay visible={loading} />
            <Stack>
                {UserGuide(title, description_userguide)}
                <TextInput label={"Target URL"} required {...form.getInputProps("url")} />
                <TextInput label={"Wordlist File"} required {...form.getInputProps("wordlist")} />
                <Button type={"submit"}>Start Brute-Forcing</Button>
                {SaveOutputToTextFile_v2(output, allowSave, hasSaved, handleSaveComplete)}
                <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
            </Stack>
        </form>
    );
};

export default GoBusterTool;
