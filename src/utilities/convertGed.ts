import {JsonParsing, ParsingOptions} from 'gedcom.json';

export async function convertGed(sourceFile): Promise<void> {
    let parsingOptions = new ParsingOptions();

    parsingOptions.SetFilePath(sourceFile);
    parsingOptions.SetConfigFile("./src/utilities/version551.yaml"); // optional! uses options/version551.yaml by default

    let parse = new JsonParsing(parsingOptions);
    const result = await parse.ParseFileAsync();
    parse.SaveAs(result.Object, './src/assets/data/jsons/test.json');
    console.log(result.Object);
}