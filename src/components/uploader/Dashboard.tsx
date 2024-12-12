import React, {forwardRef, useImperativeHandle} from "react";
// import Grid from '@mui/joy/Grid'
import { styled } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Grid from '@mui/joy/Grid';

/**
 * This demo has been simplified to showcase just the buttons within sections.
 * See the main example for all the menu items.
 */

export const Dashboard = forwardRef(({}, ref) => {

    useImperativeHandle(ref, () => ({
        hi: hi
    }));

    function hi(mess) {
        console.log("Dashboard: " +mess);
    };

    const Item = styled(Sheet)(({ theme }) => ({
        backgroundColor:
            theme.palette.mode === 'dark' ? theme.palette.background.level1 : '#fff',
        ...theme.typography['body-sm'],
        padding: theme.spacing(1),
        textAlign: 'center',
        borderRadius: 4,
        color: theme.vars.palette.text.secondary,
    }));

    return (
        <>
            <div>hello</div>
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid xs={8}>
                    <Item>xs=8</Item>
                </Grid>
                <Grid xs={4}>
                    <Item>xs=4</Item>
                </Grid>
                <Grid xs={4}>
                    <Item>xs=4</Item>
                </Grid>
                <Grid xs={8}>
                    <Item>xs=8</Item>
                </Grid>
            </Grid>
        </>
    );
});


