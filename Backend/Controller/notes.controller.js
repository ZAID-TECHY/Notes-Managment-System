import Notes from "../../Backend/model/notes.model.js";
export async function getnotes(req, resp) {
    try {
        const id = req.user.id;
        const data = await Notes.find({ writer: id }).populate("writer");
        if (!data) {
            return resp.status(400).json({
                message: "No Notes Found"
            })
        }

        resp.status(200).json({
            message: "Notes found succesfully",
            data: data
        })

    } catch (error) {
        resp.status(400).json({
            message: "error is " + error
        })
    }
}

export async function getbyid(req, resp) {
    const id = req.params.id;
    const notes = await Notes.findById(id);
    if (!notes) {
        return resp.status(400).json({
            message: "No Notes Found of this id"
        })
    }
    resp.status(200).json({
        message : "Notes found succesfully",
        notes : notes

    })

}

export async function addnotes(req, resp) {
    try {
        const id = req.user.id;
        const { title, content } = req.body;
        const timeofcreation = Date.now();
        const  lastchange = Date.now();
        const add = await Notes.create({
            writer: id,
            title: title,
            content: content,
            timeofcreation: timeofcreation,
            lastchange: timeofcreation
        })
        resp.status(200).json({
            message: "notes create succesfully",
            add: add
        })
    } catch (error) {
        resp.status(400).json({
            message: "error is " + error
        })
    }
}
export async function editnotes(req, resp) {
    try {
        const id = req.params.id;
        const { title, content } = req.body;
        const lastchange = Date.now();
        const edit = await Notes.findByIdAndUpdate(id, {
            title: title,
            content: content,
            lastchange: lastchange
        }, { returnDocument: 'after' });
        resp.status(200).json({
            message: "edites succesfully",
            data: edit
        })
    } catch (error) {
        resp.status(400).json({
            message: "edites not succesfully" + error
        })
    }
}

export async function removenotes(req, resp) {
    try {
        const id = req.params.id;
        const data = await Notes.findByIdAndDelete(id);
        if (!data) {
            return resp.status(400).json({
                message: "No Notes Found"
            })
        }
        resp.status(200).json({
            message: "Notes delete Succesfully",
            data: data
        })
    } catch (error) {

        resp.status(400).json({
            message: "message is " + error
        })
    }
}