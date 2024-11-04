import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

export const createUser = asyncHandler(async(req, res) => {
    console.log("creating a user");

    let { email } = req.body;
    const userExists = await prisma.user.findUnique({ where: { email: email } });
    if (!userExists) {
        const user = await prisma.user.create({ data: req.body });
        res.send({
            message: "User registered successfully",
            user: user
        });
    } else res.status(201).send({ message: "User already registered" });
});

// function to book a visit to residencies
export const bookVisit = asyncHandler(async(req, res) => {
    const { email, date } = req.body;
    const { id } = req.params;

    try {
        const alreadyBooked = await prisma.user.findUnique({
            where: { email },
            select: { bookedVisits: true },
        });

        // Check if the user exists
        if (!alreadyBooked) {
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure bookedVisits is defined and is an array
        if (Array.isArray(alreadyBooked.bookedVisits) &&
            alreadyBooked.bookedVisits.some((visit) => visit.id == id)) {
            return res.status(400).json({ message: "This residency is already booked by you" });
        } else {
            await prisma.user.update({
                where: { email: email },
                data: {
                    bookedVisits: { push: { id, date } },
                },
            });
            return res.send("Your visit is booked successfully");
        }
    } catch (err) {
        // Return a JSON response instead of throwing an error
        return res.status(500).json({ message: err.message });
    }
});

// function to get all booking of a user
export const getAllBookings = asyncHandler(async(req, res) => {
    const { email } = req.body
    try {
        const bookings = await prisma.user.findUnique({
            where: { email },
            select: { bookedVisits: true }
        })
        res.status(200).send(bookings)
    } catch (err) {
        throw new Error(err.message);
    }
})

// function to cancel booking 
export const cancelBooking = asyncHandler(async(req, res) => {

    const { email } = req.body
    const { id } = req.params
    try {

        const user = await prisma.user.findUnique({
            where: { email: email },
            select: { bookedVisits: true }
        })

        const index = user.bookedVisits.findIndex((visit) => visit.id === id)

        if (index === -1) {
            res.status(404).json({ message: "Booking not found" })
        } else {
            user.bookedVisits.splice(index, 1)
            await prisma.user.update({
                where: { email },
                data: {
                    bookedVisits: user.bookedVisits
                }
            })
            res.send("Booking cancelled successfully")
        }

    } catch (err) {
        throw new Error(err.message);
    }
})

//function to add a resd in favourate list of a user
export const toFav = asyncHandler(async(req, res) => {
    const { email } = req.body;
    const { rid } = req.params;

    try {

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (user.favResidenciesID.includes(rid)) {
            const updateUser = await prisma.user.update({
                where: { email },
                data: {
                    favResidenciesID: {
                        set: user.favResidenciesID.filter((id) => id != rid)
                    }
                }

            });

            res.send({ message: "Removed from favourites", user: updateUser })
        } else {
            const updateUser = await prisma.user.update({

                where: { email },
                data: {
                    favResidenciesID: {
                        push: rid
                    }
                }
            })

            res.send({ message: "Update favourites", user: updateUser })
        }
    } catch (err) {
        throw new Error(err.message);
    }
})


//function to get all favourites
export const getAllFavourites = asyncHandler(async(req, res) => {
    const { email } = req.body;
    try {
        const favResd = await prisma.user.findUnique({
            where: { email },
            select: { favResidenciesID: true }
        });
        res.status(200).send(favResd);

    } catch (err) {
        throw new Error(err.message);
    }
});